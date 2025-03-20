<?php

namespace App\Repositories;

use App\Interfaces\BaseInterface;
use App\Models\Category;
use Illuminate\Database\Eloquent\Model;

class BaseRepository implements BaseInterface
{
    protected $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }
    public function all($paginate = null, $relations = [], $conditions = [])
    {
        $query = $this->model->with($relations);

        if (!empty($conditions)) {
            foreach ($conditions as $column => $value) {
                $query->where($column, $value);
            }
        }

        return $paginate ? $query->paginate($paginate) : $query->get();
    }

    public function find($id, $relations = [])
    {
        return $this->model->with($relations)->findOrFail($id);
    }

    public function store(array $data)
    {
        return $this->model->create($data);
    }

    public function update($id, array $data)
    {
        $model = $this->model->find($id);
        $model->update($data);
        return $model;
    }

    public function delete($id)
    {
        $model = $this->model->find($id);
        $model->delete();
    }
}
