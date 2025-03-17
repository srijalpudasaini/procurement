<?php

namespace App\Interfaces;

interface RoleInterface
{
    public function all($per_page);
    public function find($id);
    public function store(array $data);
    public function update($id, array $data);
    public function delete($id);
}
